import { Request, Response } from "express";
import { getRepository } from "typeorm";
import * as Yup from "yup";

import Orphanage from "../models/Orphanage";
import orphanagesView from "../views/orphanages.view";

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanage);

    const orphanages = await orphanagesRepository.find({
      relations: ["images"]
    });

    return response.status(200).json(orphanagesView.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const orphanagesRepository = getRepository(Orphanage);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ["images"]
    });

    return response.status(200).json(orphanagesView.render(orphanage));

    // try {
    //   const orphanage = await orphanagesRepository.findOneOrFail(id, {
    //     relations: ["images"]
    //   });

    //   return response.status(200).json(orphanageView.render(orphanage));      
    // } catch {
    //   return response.status(404).json({ error: "Orfanato não encontrado" });      
    // }
  },

  async create(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends
    } = request.body;

    const orphanagesRepository = getRepository(Orphanage);
  
    const requestImages = request.files as Express.Multer.File[];

    const images = requestImages.map(image => {
      return { path: image.filename };
    });

    let openOnWeekends = open_on_weekends;

    if(openOnWeekends === "true") {
      openOnWeekends = true;
    }

    if(openOnWeekends === "false") {
      openOnWeekends = false;
    }

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: openOnWeekends,
      images
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required()
        })
      )
    });

    await schema.validate(data, {
      abortEarly: false
    });

    const orphanage = orphanagesRepository.create(data);
    
    await orphanagesRepository.save(orphanage);
  
    return response.status(201).json(orphanage);
  }
};